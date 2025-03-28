import React, { useState, useEffect } from 'react';
// Import Authenticator component AND the useAuthenticator hook
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css'; // Default Amplify UI styles
// Import the specific function needed for fetching attributes
import { fetchUserAttributes } from 'aws-amplify/auth';

// --- Add Amplify API Imports ---
import { get } from 'aws-amplify/api'; // For making GET requests
import { fetchAuthSession } from 'aws-amplify/auth'; // To get tokens
// --- End Amplify API Imports ---

import './App.css'; // Import your app-specific styles

// Interface reflecting attribute structure, ensuring types match Cognito/Amplify response
interface UserAttributes {
  sub?: string; // Unique user identifier
  email?: string;
  email_verified?: string; // Comes as 'true'/'false' string
  given_name?: string; // First Name
  family_name?: string; // Last Name
}

// --- Define Interface for API Response ---
interface HelloApiResponse {
  message: string; // Expect an object with a 'message' property of type string
  // Add other properties if your API returns more data
}
// --- End API Response Interface ---

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

  // --- Add State for API Response ---
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  // --- End State for API Response ---

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

    // --- Add Function to Call Hello API ---
    const callHelloApi = async () => {
      console.log('Calling /hello API...');
      setApiError(null); // Clear previous errors
      setApiResponse(null); // Clear previous response
      setIsLoadingApi(true); // Set loading state
  
      try {
        // Retrieve the current user's session, including the ID token
        // This step might not be strictly necessary if Amplify automatically includes it,
        // but it's good practice to understand where the token comes from.
        const session = await fetchAuthSession({ forceRefresh: false }); // Use cached session if valid
        const idToken = session.tokens?.idToken;
  
        if (!idToken) {
           throw new Error('No ID token found in session.');
        }
        console.log('Using ID Token:', idToken?.toString().substring(0, 30) + '...'); // Log truncated token
  
        // Make the GET request using Amplify API category
        // It automatically uses the endpoint defined in configuration
        // and can automatically sign requests or attach tokens.
        const restOperation = get({
          apiName: 'TravelM8Api', // Logical name defined in Amplify.configure
          path: '/hello', // The specific path for the endpoint
          options: {
            headers: {
               // Amplify often injects this automatically for Cognito User Pool authorizers
               // based on the logged-in user's session, but explicitly adding it
               // ensures it's present if automatic injection behavior changes.
               Authorization: `Bearer ${idToken.toString()}`
            }
          }
        });
  
        // Await the response promise
        const { body } = await restOperation.response;
        const responseData = await body.json(); // Parse the JSON response body

        // First cast to unknown, then check if it has the expected structure
const unknownData = responseData as unknown;

// Type guard to check if the data matches our expected structure
if (
  unknownData && 
  typeof unknownData === 'object' && 
  'message' in unknownData && 
  typeof (unknownData as any).message === 'string'
) {
  // Now it's safe to cast to our interface
  const typedResponse = unknownData as HelloApiResponse;
  console.log('API Response Data:', typedResponse);
  setApiResponse(typedResponse.message);
} else {
  console.warn('API response does not match expected format:', responseData);
  // Fallback for unexpected structure
  setApiResponse(
    typeof responseData === 'string' 
      ? responseData 
      : JSON.stringify(responseData)
  );
}

    } catch (error: any) {
      console.error('Error calling API:', error);
      let errorMessage = 'Failed to fetch data from API.';
      // Attempt to get more specific error message if response exists
      if (error.response && error.response.data) {
        errorMessage = JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      setApiError(errorMessage);
    } finally {
      setIsLoadingApi(false);
    }
  };
  // --- End Function to Call Hello API ---

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
          {/* Display User Details if attributes are loaded */}
          {attributes ? (
            <>
              <p>Hello, {attributes.given_name || attributes.email || 'User'}!</p>
              <p>Your email: {attributes.email}</p>
              {/* Optional: <p>Email Verified: {attributes.email_verified === 'true' ? 'Yes' : 'No'}</p> */}
            </>
          ) : (
            // Show loading message while attributes are fetched
            <p>Loading user details...</p>
          )}
          {/* Sign Out Button */}
          <button onClick={signOut}>Sign Out</button>
        </header>
  
        {/* Main content area */}
        <main style={{ padding: '20px' }}> {/* Added some padding for better layout */}
           <h2>Test Backend API</h2>
           {/* Button to trigger the API call */}
           <button onClick={callHelloApi} disabled={isLoadingApi}>
             {isLoadingApi ? 'Calling API...' : 'Call /hello Endpoint'}
           </button>
  
           {/* Display API Response if available */}
           {apiResponse && (
             <div style={{ marginTop: '20px', padding: '10px', border: '1px solid green', backgroundColor: '#e6ffe6' }}>
               <strong>API Success:</strong>
               {/* Use <pre> for preformatted text, good for JSON or simple strings */}
               <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                 {apiResponse}
               </pre>
             </div>
           )}
  
           {/* Display API Error if available */}
           {apiError && (
             <div style={{ marginTop: '20px', padding: '10px', border: '1px solid red', backgroundColor: '#ffe6e6' }}>
               <strong>API Error:</strong>
               <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'red' }}>
                 {apiError}
               </pre>
             </div>
           )}
        </main>
      </div>
    );
}
// --- End AuthenticatedAppContent Component ---



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