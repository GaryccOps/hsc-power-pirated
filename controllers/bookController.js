const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

// Initialize Supabase client
const accessToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IjFhOG9ad1NWODNsSzRNK2UiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2h2ZnZ6bGJuaWZsa3Zid2N4d2NsLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjMTZiM2Q5Mi0xNTE5LTRmMjAtYTYyYy04YTM5YTljNDEzMGQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwNTEyNDkyLCJpYXQiOjE3NjA1MDg4OTIsImVtYWlsIjoiMTIzQDEyMy5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2MDUwODg5Mn1dLCJzZXNzaW9uX2lkIjoiMGY3MjRlMjUtYzMzYy00MjZhLWI3NWMtYWZiYjA3YTAwYzlkIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.NKFpsRG6jle4IMjWfJS-gaop2LQv5fWPqrMJ0CwWZjg"
// Controller to add a book
exports.addBook = async (req, res) => {
  const { bookName } = req.body;
  try {
    // Insert book data into Supabase
    const supabasex = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { data, error } = await supabase
      .from('book') // Replace 'books' with your Supabase table name
      .insert([{bookName: bookName }]);

    if (error) {
      return res.status(400).json({ message: 'Failed to add book', error: error.message });
    }

    res.status(201).json({ message: 'Book added successfully', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};