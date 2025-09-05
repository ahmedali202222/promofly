import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Temporary function to create admin user
// Remove this after setting up your admin account
export const createAdminUser = async () => {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'ack48212@gmail.com', 
      'Abuharoon.313'
    );
    console.log('Admin user created:', userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists');
    }
    throw error;
  }
};

// Call this function once to create the admin user
// createAdminUser();
