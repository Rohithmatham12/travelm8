import React, { useState, useEffect } from 'react';
// Import Authenticator component AND the useAuthenticator hook
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'; // Default Amplify UI styles
// Import the specific function needed for fetching attributes
import { fetchUserAttributes } from 'aws-amplify/auth';

import './App.css'; // Import your app-specific styles

// Interface reflecting attribute structure, ensuring types match Cognito/Amplify response
interface UserAttributes {
  sub?: string; // Unique user identifier
  email?: string;
  email_verified?: string; // Comes as 'true'/'false' string
  given_name?: string; // First Name
  family_name?: string; // Last Name
}

// --------- Separate Component for Authenticated Content ----------
// This component renders only when the user is authenticated.
// It uses the useAuthenticator hook correctly.
// ---------------------------------------------------------------
function AuthenticatedAppContent() {
  // Get user object and signOut function using the hook
  // The hook ensures this component re-renders when auth state changes
  const { user, signOut } = useAuthenticator((context) => [context.user, context.signOut]);
  // State to hold the fetched user attributes
  const [attributes, setAttributes] = useState<UserAttributes | null>(null);

  // Function to fetch attributes from Cognito
  const fetchCurrentUserAttributes = async () => {
    try {
      console.log('Fetching user attributes...');
      const userAttributes = await fetchUserAttributes();
      console.log('Attributes fetched:', userAttributes);
      setAttributes(userAttributes);
    } catch (e) {
      console.error('Error fetching user attributes:', e);
      setAttributes(null); // Clear attributes on error
    }
  };

  // useEffect Hook: Runs after component mounts and when 'user' changes
  // Fetches attributes when the user logs in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (user) {
      // Only fetch if the user object is available
      fetchCurrentUserAttributes();
    } else {
      // Clear attributes if user logs out
      setAttributes(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Dependency array includes 'user'

  // Optional: Handle the case where the hook hasn't provided the user yet
  if (!user) {
    return <p>Loading...</p>; // Or return null
  }

  // Render the main content for an authenticated user
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to TravelM8!</h1>
        <>
          {/* Display user details if attributes have been loaded */}
          {attributes ? (
            <>
              {/* User-friendly greeting: Use first name, fallback to email */}
              <p>Hello, {attributes.given_name || attributes.email || 'User'}!</p>
              <p>Your email: {attributes.email}</p>
              {/* Optional: Display verification status */}
              {/* <p>Email Verified: {attributes.email_verified === 'true' ? 'Yes' : 'No'}</p> */}
            </>
          ) : (
            // Show a loading message while attributes are fetched
            <p>Loading user details...</p>
          )}

          {/* Sign Out Button */}
          <button onClick={signOut}>Sign Out</button>
        </>
      </header>
      {/* --- Future application content will go here --- */}
      <main>
        <p>Your personalized travel planner content will appear here.</p>
      </main>
      {/* --- End of future content area --- */}
    </div>
  );
}


// ------------- Main App Component -------------
// This component sets up the Authenticator wrapper.
// --------------------------------------------
function App() {

  // Define the fields required and their configuration for the Sign Up form
  const formFields = {
    signUp: {
      email: { // Standard email field
        order: 1,
        isRequired: true,
      },
      given_name: { // Custom field for First Name (maps to Cognito 'given_name')
        label: 'First Name',
        placeholder: 'Enter your first name',
        order: 2, // Display after email
        isRequired: true, // Required by our Cognito setup
      },
      family_name: { // Custom field for Last Name (maps to Cognito 'family_name')
        label: 'Last Name',
        placeholder: 'Enter your last name',
        order: 3, // Display after first name
        isRequired: true, // Required by our Cognito setup
      },
      password: { // Standard password field
        order: 4,
        isRequired: true,
      },
      confirm_password: { // Standard confirm password field
        order: 5,
        isRequired: true,
      },
    },
    // You can customize other forms too (signIn, confirmSignUp, etc.) if needed
  };

  return (
    // The Authenticator component wraps the part of the app that requires login.
    // It handles rendering the login UI or the authenticated content.
    // We pass the formFields configuration to customize the sign-up form.
    <Authenticator formFields={formFields}>
      {/*
         When the user is authenticated, the Authenticator will render
         its children. In this case, it renders our AuthenticatedAppContent component.
      */}
      <AuthenticatedAppContent />
    </Authenticator>
  );
}

export default App;