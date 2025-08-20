export async function register() {
  // This function runs once when the server starts
  // Environment variables will be available at runtime
  if (process.env.NODE_ENV === 'production') {
    console.log('Runtime environment variables loaded');
  }
}