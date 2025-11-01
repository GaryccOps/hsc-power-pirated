import { openai } from '../clients/openaiClient.js';
import { supabase } from '../clients/supabaseClient.js';
import ErrorResponse from '../utils/errorResponse.js';
import fs from 'fs/promises';

/**
 * Generate weekly report for a student
 * POST /users/weekly-report
 * Body: { student_id: uuid, report_week_start: date, report_week_end: date, model?: string }
 */
export const generateWeeklyReport = async (req, res) => {
  const { student_id, report_week_start, report_week_end, model = 'gpt-4.1-nano' } = req.body;

  // Validation
  if (!student_id) {
    return ErrorResponse.badRequest('Student ID is required').send(res);
  }
  if (!report_week_start || !report_week_end) {
    return ErrorResponse.badRequest('Report week start and end dates are required').send(res);
  }

  // Ensure dates are in ISO format
  const weekStart = new Date(report_week_start).toISOString();
  const weekEnd = new Date(report_week_end).toISOString();
  
  if (isNaN(new Date(report_week_start).getTime()) || isNaN(new Date(report_week_end).getTime())) {
    return ErrorResponse.badRequest('Invalid date format. Please use YYYY-MM-DD format').send(res);
  }

  try {
    // Fetch all student data from database
    const studentData = await fetchStudentData(student_id, weekStart, weekEnd);
    
    if (!studentData) {
      return ErrorResponse.notFound('Student not found').send(res);
    }

    // Format student data into GPT-readable text format
    let formattedData = formatStudentDataForGPT(studentData, report_week_start, report_week_end);
    
    // Sanitize formatted data - remove any problematic characters
    formattedData = sanitizeTextForAPI(formattedData);
    
    // Validate formatted data size (limit to prevent API errors)
    const MAX_INPUT_LENGTH = 50000;
    if (formattedData.length > MAX_INPUT_LENGTH) {
      console.warn(`Formatted data is very large (${formattedData.length} chars). Truncating...`);
      formattedData = formattedData.substring(0, MAX_INPUT_LENGTH) + '\n\n[Data truncated due to size limits]';
    }
    
    console.log('Formatted Data Length:', formattedData.length);
    console.log('Formatted Data Preview:', formattedData.substring(0, 500));

    // Read the weekly report instructions
    let instructions = await fs.readFile("instructions/weekly-report-instr.md", "utf-8");
    
    // Prepare API request payload
    const requestPayload = {
      model: model,
      instructions: instructions,
      input: [
        {
          role: 'user',
          content: formattedData
        }
      ],
      temperature: 0.7,
      max_tokens: 3000 // Increased for comprehensive reports
    };
    
    // Call OpenAI API with instructions and formatted student data
    let responses;
    try {
     
      responses = await openai.responses.create(requestPayload);
      
      console.log('API Response received:', {
        hasOutputText: !!responses.output_text,
        hasOutput: !!responses.output,
        keys: Object.keys(responses || {})
      });
    } catch (apiError) {
      console.error('OpenAI API Error:', apiError);
      console.error('Error type:', typeof apiError);
      console.error('Error constructor:', apiError?.constructor?.name);
      console.error('Error details:', {
        message: apiError.message,
        code: apiError.code,
        status: apiError.status,
        statusCode: apiError.statusCode,
        response: apiError.response,
        body: apiError.body,
        error: apiError.error
      });
      
      // Try to extract error message from various error formats
      let errorMessage = apiError.message || 'Unknown error';
      if (apiError.response?.data?.error?.message) {
        errorMessage = apiError.response.data.error.message;
      } else if (apiError.error?.message) {
        errorMessage = apiError.error.message;
      } else if (apiError.body?.error?.message) {
        errorMessage = apiError.body.error.message;
      }
      
      return ErrorResponse.internalServerError(
        'OpenAI API request failed',
        errorMessage
      ).send(res);
    }

    // Check if response has error
    if (responses.error) {
      console.error('OpenAI API returned error:', responses.error);
      return ErrorResponse.internalServerError(
        'OpenAI API error',
        responses.error.message || JSON.stringify(responses.error)
      ).send(res);
    }
    
    // Parse the output text as JSON
    let weeklyReport;
    try {
      let outputText = responses.output_text || responses.output?.text || '';
      
      if (!outputText) {
        console.error('No output_text in response:', responses);
        return ErrorResponse.internalServerError(
          'No response content from OpenAI API',
          'The API did not return any output text'
        ).send(res);
      }
      
      // Parse JSON
      weeklyReport = JSON.parse(outputText);
      console.log('Weekly Report Generated:', weeklyReport);
    } catch (parseError) {
      console.error('Error parsing weekly report JSON:', parseError);
      console.error('Raw output:', responses.output_text);
      console.error('Full response:', JSON.stringify(responses, null, 2));
      return ErrorResponse.internalServerError(
        'Failed to parse weekly report JSON',
        parseError.message
      ).send(res);
    }

    res.status(200).json({
      success: true,
      message: 'Weekly report generated successfully',
      data: {
        weekly_report: weeklyReport
      }
    });
  } catch (error) {
    console.error('Weekly Report Error:', error);
    return ErrorResponse.fromException(error, 500).send(res);
  }
};

/**
 * Fetch all relevant student data from Supabase
 */
async function fetchStudentData(studentId, weekStart, weekEnd) {
  try {
    // 1. Fetch student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // 2. Fetch enrollments with classes
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        classes (*)
      `)
      .eq('student_id', studentId);

    if (enrollmentsError) {
      throw enrollmentsError;
    }

    const classIds = enrollments?.map(e => e.class_id) || [];

    // 3. Fetch teachers for each class
    let teachersByClass = {};
    if (classIds.length > 0) {
      const { data: classTeachers, error: teachersError } = await supabase
        .from('class_teachers')
        .select('class_id, profile_id, role_in_class')
        .in('class_id', classIds);

      if (teachersError) {
        throw teachersError;
      }

      // Fetch teacher profiles separately
      const teacherIds = [...new Set(classTeachers?.map(ct => ct.profile_id) || [])];
      let teacherProfiles = {};
      
      if (teacherIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, first_name, last_name')
          .in('id', teacherIds);

        if (profilesError) {
          throw profilesError;
        }

        profiles?.forEach(p => {
          teacherProfiles[p.id] = p.name || 
            `${p.first_name || ''} ${p.last_name || ''}`.trim() ||
            'Unknown Teacher';
        });
      }

      classTeachers?.forEach(ct => {
        if (!teachersByClass[ct.class_id]) {
          teachersByClass[ct.class_id] = [];
        }
        const teacherName = teacherProfiles[ct.profile_id] || 'Unknown Teacher';
        teachersByClass[ct.class_id].push(teacherName);
      });
    }

    // 4. Fetch assignments (upcoming and in date range)
    let assignments = [];
    if (classIds.length > 0) {
      // Fetch assignments due in the week or posted in the week
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .in('class_id', classIds);

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Filter assignments that are relevant to this week
      assignments = (assignmentsData || []).filter(a => {
        const dueDate = a.due_date ? new Date(a.due_date) : null;
        const postedDate = a.posted_date ? new Date(a.posted_date) : null;
        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekEnd);
        
        // Include if due in week or posted in week or upcoming after week end
        if (dueDate && (dueDate >= weekStartDate && dueDate <= weekEndDate)) return true;
        if (postedDate && (postedDate >= weekStartDate && postedDate <= weekEndDate)) return true;
        if (dueDate && dueDate > weekEndDate) return true; // Upcoming
        return false;
      });
    }

    // 5. Fetch assignment submissions (completed this week)
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('student_id', studentId)
      .gte('submitted_at', weekStart)
      .lte('submitted_at', weekEnd);

    if (submissionsError) {
      throw submissionsError;
    }

    // Fetch assignment details for submissions
    const assignmentIds = [...new Set(submissions?.map(s => s.assignment_id) || [])];
    let assignmentDetails = {};
    if (assignmentIds.length > 0) {
      const { data: assignmentsForSubs, error: assignError } = await supabase
        .from('assignments')
        .select('*')
        .in('id', assignmentIds);

      if (assignError) {
        throw assignError;
      }

      assignmentsForSubs?.forEach(a => {
        assignmentDetails[a.id] = a;
      });
    }

    // Attach assignment details to submissions
    const submissionsWithDetails = submissions?.map(s => ({
      ...s,
      assignments: assignmentDetails[s.assignment_id]
    })) || [];

    // 6. Fetch grade history for the week
    const { data: gradeHistory, error: gradeError } = await supabase
      .from('class_grade_history')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd);

    if (gradeError) {
      throw gradeError;
    }

    // 7. Fetch study preferences
    const { data: studyPreferences, error: studyError } = await supabase
      .from('student_study_preferences')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (studyError && studyError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw studyError;
    }

    // 8. Fetch class schedule sessions (for attendance calculation)
    let classSessions = [];
    if (classIds.length > 0) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('class_schedule_sessions')
        .select('*')
        .in('class_id', classIds);

      if (sessionsError) {
        throw sessionsError;
      }
      classSessions = sessions || [];
    }

    return {
      profile,
      enrollments,
      teachersByClass,
      assignments,
      submissions: submissionsWithDetails,
      gradeHistory,
      studyPreferences,
      classSessions
    };
  } catch (error) {
    console.error('Error fetching student data:', error);
    throw error;
  }
}

/**
 * Format student data into readable text for GPT
 */
function formatStudentDataForGPT(studentData, weekStart, weekEnd) {
  const { profile, enrollments, teachersByClass, assignments, submissions, gradeHistory, studyPreferences, classSessions } = studentData;

  // Build class information map for easier reference
  const classInfo = {};
  enrollments?.forEach(e => {
    if (e.classes) {
      const classId = e.class_id;
      const className = e.classes.name || e.classes.code || 'Unknown Class';
      const teachers = teachersByClass[classId] || [];
      classInfo[classId] = {
        name: className,
        code: e.classes.code || '',
        teachers: teachers.length > 0 ? teachers.join(', ') : 'Unknown Teacher',
        progress: e.progress || 0,
        grade: e.grade || null
      };
    }
  });

  // Format student information
  let formatted = "";
  const studentName = profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
  formatted += `Student Name: ${studentName}\n`;
  
  // Add enrolled classes
  const classesList = Object.values(classInfo).map(c => c.name);
  if (classesList.length > 0) {
    formatted += `Classes: ${classesList.join(', ')}\n`;
  }
  
  formatted += `\n`;

  // Calculate attendance
  const totalSessions = classSessions.length;
  // Note: Actual attendance tracking would need an attendance table
  // For now, we'll estimate based on submissions and grades
  const attendedSessions = Math.min(totalSessions, submissions.length + Math.floor(gradeHistory.length / 2));
  formatted += `Attendance records: attended ${attendedSessions} out of ${totalSessions || 'unknown'} sessions this week\n\n`;

  // Average scores by class
  const scoresByClass = {};
  gradeHistory.forEach(grade => {
    if (!scoresByClass[grade.class_id]) {
      scoresByClass[grade.class_id] = [];
    }
    if (grade.score && grade.max_score) {
      scoresByClass[grade.class_id].push((grade.score / grade.max_score) * 100);
    }
  });

  // Submissions also contribute to scores
  submissions.forEach(sub => {
    if (sub.grade && sub.assignments?.total_points) {
      const classId = sub.assignments.class_id;
      if (!scoresByClass[classId]) {
        scoresByClass[classId] = [];
      }
      scoresByClass[classId].push((sub.grade / sub.assignments.total_points) * 100);
    }
  });

  // Format average scores with class names
  let avgScores = [];
  Object.entries(scoresByClass).forEach(([classId, scores]) => {
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const className = classInfo[classId]?.name || 'Unknown';
      avgScores.push(`${className}: ${avg.toFixed(0)}`);
    }
  });
  if (avgScores.length > 0) {
    formatted += `Average scores: ${avgScores.join(', ')}\n\n`;
  }
  
  // Add detailed course breakdown
  if (Object.keys(classInfo).length > 0) {
    formatted += `Course Details:\n`;
    Object.entries(classInfo).forEach(([classId, info]) => {
      formatted += `- ${info.name} (Code: ${info.code || 'N/A'}): Teacher: ${info.teachers}, Progress: ${info.progress}%, Grade: ${info.grade || 'N/A'}\n`;
    });
    formatted += `\n`;
  }

  // Progress by class
  let progressInfo = [];
  enrollments?.forEach(e => {
    if (e.classes && e.progress !== null) {
      const className = classInfo[e.class_id]?.name || 'Unknown';
      progressInfo.push(`${className}: ${(e.progress / 100).toFixed(2)}`);
    }
  });
  if (progressInfo.length > 0) {
    formatted += `Progress this week: ${progressInfo.join(', ')}\n\n`;
  }

  // Study hours by subject
  let studyHours = [];
  if (studyPreferences?.preferences?.study_hours) {
    Object.entries(studyPreferences.preferences.study_hours).forEach(([subject, hours]) => {
      studyHours.push(`${subject}: ${hours}`);
    });
  }
  
  // If no study preferences, estimate from submissions
  if (studyHours.length === 0 && enrollments) {
    enrollments.forEach(e => {
      if (e.classes) {
        const classSubmissions = submissions.filter(s => s.assignments?.class_id === e.class_id);
        const estimatedHours = classSubmissions.length * 2; // Estimate 2 hours per submission
        if (estimatedHours > 0) {
          const className = classInfo[e.class_id]?.name || 'Unknown';
          studyHours.push(`${className}: ${estimatedHours}`);
        }
      }
    });
  }

  if (studyHours.length > 0) {
    formatted += `Study hours: ${studyHours.join(', ')}\n\n`;
  }

  // Assignments completed
  if (submissions && submissions.length > 0) {
    formatted += `Assignments completed:\n`;
    submissions.forEach(sub => {
      if (sub.assignments) {
        const className = classInfo[sub.assignments.class_id]?.name || 'Unknown';
        formatted += `"${sub.assignments.title}" for ${className}`;
        if (sub.submitted_at) {
          const submitDate = new Date(sub.submitted_at).toISOString().split('T')[0];
          formatted += `, submitted on ${submitDate}`;
        }
        if (sub.grade !== null && sub.grade !== undefined) {
          formatted += `, scored ${sub.grade}`;
          if (sub.assignments.total_points) {
            formatted += `/${sub.assignments.total_points}`;
            const percentage = ((sub.grade / sub.assignments.total_points) * 100).toFixed(0);
            formatted += ` (${percentage}%)`;
          }
        }
        formatted += `\n`;
      }
    });
    formatted += `\n`;
  }
  
  // Grade history details
  if (gradeHistory && gradeHistory.length > 0) {
    formatted += `Grade History for this week:\n`;
    gradeHistory.forEach(grade => {
      const className = classInfo[grade.class_id]?.name || 'Unknown';
      formatted += `- ${className}: ${grade.assessment || 'Assessment'}`;
      if (grade.score !== null && grade.max_score !== null) {
        formatted += ` - ${grade.score}/${grade.max_score}`;
        const percentage = ((grade.score / grade.max_score) * 100).toFixed(0);
        formatted += ` (${percentage}%)`;
      }
      if (grade.grade) {
        formatted += ` - Grade: ${grade.grade}`;
      }
      formatted += `\n`;
    });
    formatted += `\n`;
  }

  // Additional context
  formatted += `This input provides the student's attendance, study habits, progress, and task completion data for the week of ${weekStart} to ${weekEnd}.`;

  return formatted;
}

/**
 * Sanitize text to ensure it's safe for API calls
 * Removes problematic characters and ensures proper encoding
 */
function sanitizeTextForAPI(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  // Remove null bytes and control characters (except newlines and tabs)
  text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Ensure proper line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove any trailing whitespace
  text = text.trimEnd();
  
  return text;
}
