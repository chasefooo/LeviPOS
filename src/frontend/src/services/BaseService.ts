import axios from 'axios';
import appConfig from '@/configs/app.config';
import { TOKEN_TYPE, REQUEST_HEADER_AUTH_KEY } from '@/constants/api.constant';
// import { PERSIST_STORE_NAME } from '@/constants/app.constant'; // no longer needed if using Amplify directly
// Instead of using Redux/localStorage for the token, we can fetch it directly from Amplify.
import * as AmplifyAuth from '@aws-amplify/auth';

const unauthorizedCode = [401];

const BaseService = axios.create({
    timeout: 60000,
    baseURL: appConfig.apiPrefix,
});

BaseService.interceptors.request.use(
    async (config) => {
        try {
            // Use the modular API via a namespace import and cast to any
            const session = await (AmplifyAuth as any).currentSession();
            const accessToken = session.getAccessToken().getJwtToken();
            if (accessToken) {
                config.headers[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${accessToken}`;
            }
        } catch (error) {
            console.error('Error fetching session from Amplify:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

BaseService.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;
        if (response && unauthorizedCode.includes(response.status)) {
            // You might dispatch a sign-out action or handle unauthorized state here.
        }
        return Promise.reject(error);
    }
);

export default BaseService;
