import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// --- Add Amplify Imports ---
import { Amplify } from 'aws-amplify';
// --- End Amplify Imports ---

// --- Add Amplify Configuration ---
// This section connects your React app to the AWS Cognito
// User Pool that you created using CDK in Step 4.
Amplify.configure({
  Auth: {
    Cognito: {
      // REQUIRED - Amazon Cognito User Pool ID
      // Get this value from the 'UserPoolIdOutput' in your terminal
      // after running 'cdk deploy' successfully in Step 4.
      userPoolId: 'us-east-1_bY2dFmDdy', // <-- REPLACE THIS !!! (e.g., 'us-east-1_abcdEFGH')

      // REQUIRED - Amazon Cognito Web Client ID
      // Get this value from the 'UserPoolClientIdOutput' in your terminal
      // after running 'cdk deploy' successfully in Step 4.
      userPoolClientId: '70u6je3co6eftg5rd3dlr8agrq', // <-- REPLACE THIS !!! (e.g., '123456789abcdefghijklmnopq')

      // OPTIONAL: Configure redirect URLs if using OAuth/social providers later
      // oauth: {
      //   domain: 'your-cognito-domain.auth.us-east-1.amazoncognito.com', // You'd need to set this up in Cognito
      //   scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
      //   redirectSignIn: 'http://localhost:3000/', // URL after successful sign-in
      //   redirectSignOut: 'http://localhost:3000/', // URL after sign-out
      //   responseType: 'code' // 'code' for Authorization Code Grant, 'token' for Implicit Grant
      // }
    }
  },

    // --- Add API Configuration ---
    API: {
      REST: { // Define a REST API endpoint configuration
        TravelM8Api: { // Give your API a logical name (can be anything)
          endpoint: 'https://nkecrmudvi.execute-api.us-east-1.amazonaws.com/', // <--- Replace with ApiEndpointOutput from Step 6
          region: 'us-east-1' // <--- Replace with the region you deployed to (e.g., 'us-east-1')
        }
      }
    }
    // --- End API Configuration ---
});
// --- End Amplify Configuration ---

// Standard React setup to render your App component into the HTML
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App /> {/* Renders your main application component */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();