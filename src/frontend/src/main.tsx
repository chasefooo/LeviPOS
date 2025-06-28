import ReactDOM from 'react-dom/client';
import App from './App';
import { Amplify } from 'aws-amplify';
import awsConfig from './constants/aws-exports';
import { AuthProvider } from './contexts/AuthContext';


// Cast to any so TS doesn't complain about missing "configure"
(Amplify as any).configure(awsConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <AuthProvider>
        <App />
    </AuthProvider>
);