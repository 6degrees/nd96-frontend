import axios from 'axios'
import {getItem} from '@/utils/localStorageControl'
import {buildFormData} from '@/utils/buildFormData'
import { useI18nStore } from '@/shared/i18n'
import Cookies from "js-cookie";

/*
|--------------------------------------------------------------------------
| getCurrentLanguage Helper
|--------------------------------------------------------------------------
|
| Retrieves the active language from the i18next instance.
|
*/
const currentLanguage = () => useI18nStore.getState().lang

/*
|--------------------------------------------------------------------------
| authHeader
|--------------------------------------------------------------------------
|
| Generates authorization header using the stored access token.
| This ensures every request is authenticated with Bearer token.
|
*/
const authHeader = () => ({
    Authorization: `Bearer ${getItem('tenant_access_token')}`,
    'Accept-Language': currentLanguage(),
})

/*
|--------------------------------------------------------------------------
| Axios Client Instance
|--------------------------------------------------------------------------
|
| Creates a pre-configured axios instance used for all HTTP requests.
| This ensures consistent headers and configuration across the app.
|
| Features:
| - Automatically attaches Bearer token from localstorage
| - Can be extended with baseURL for API environment config
|
*/
const client = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_ENDPOINT}`,
    headers: {
        Authorization: `Bearer ${getItem('tenant_access_token')}`,
    },
})

/*
|--------------------------------------------------------------------------
| ApiClient (API Layer)
|--------------------------------------------------------------------------
|
| Centralized service for handling all HTTP requests using axios.
| Updated with Generics <T> to support TypeScript type safety.
|
*/
class httpClient {
    /*
    |--------------------------------------------------------------------------
    | GET Request
    |--------------------------------------------------------------------------
    |
    | Sends a GET request to the given endpoint.
    |
    */
    static get<T = any>(path = '', config = {}) {
        return client.get<T>(`${path}`, {
            ...config,
            headers: {
                ...authHeader(),
                ...((config as any).headers || {})
            },
        })
    }

    /*
    |--------------------------------------------------------------------------
    | POST Request
    |--------------------------------------------------------------------------
    |
    | Sends a POST request with data to the given endpoint.
    |
    */
    static post<T = any>(path = '', data = {}, optionalHeader = {}) {
        return client.post<T>(`${path}`, buildFormData(data), {headers: {...authHeader(), ...optionalHeader,},})
    }

    /*
    |--------------------------------------------------------------------------
    | PATCH Request
    |--------------------------------------------------------------------------
    |
    | Sends a PATCH request to partially update a resource.
    |
    */
    static patch<T = any>(path = '', data = {}) {
        return client.patch<T>(`${path}`, buildFormData(data), {headers: {...authHeader()},})
    }

    /*
    |--------------------------------------------------------------------------
    | PUT Request
    |--------------------------------------------------------------------------
    |
    | Sends a PUT request to fully update a resource.
    |
    */
    static put<T = any>(path = '', data = {}) {
        return client.put<T>(`${path}`, buildFormData(data), {headers: {...authHeader()},})
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE Request
    |--------------------------------------------------------------------------
    |
    | Sends a DELETE request to remove a specific resource.
    |
    */
    static delete<T = any>(path = '') {
        return client.delete<T>(`${path}`, {headers: {...authHeader()},})
    }
}

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
|
| Intercepts every outgoing request and injects the latest access token
| into the headers to ensure auth is always up-to-date.
|
*/
client.interceptors.request.use((config) => {
    const token = getItem('tenant_access_token')

    if (token && token !== 'undefined' && token !== 'null') {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
|
| Intercepts every outgoing request to inject the latest token and
| dynamically swap out the '{{tenant}}' placeholders with the current cookie.
|
*/
client.interceptors.request.use((config) => {
    const activeTenantId = localStorage.getItem('active_tenant_id')

    const activeBranch = localStorage.getItem('active_branch_id')

    if (config.url && activeTenantId) {
        config.url = config.url.replace('{{tenant}}', activeTenantId)
    }

    if (config.url && activeBranch) {
        config.url = config.url.replace('{{branch}}', activeBranch)
    }

    return config
})

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
|
| Intercepts responses globally to handle errors such as:
| - Server errors (500)
| - Authentication issues
| - Retry logic (can be extended)
|
*/
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const {response} = error

        if (response) {
            if (response.status === 401) {
                if (typeof window !== 'undefined') {
                    Cookies.remove('tenant_access_token')
                    localStorage.clear()
                    sessionStorage.clear()
                    window.location.href = '/auth/login'
                }
            }

            if (response.status === 500) {
            }
        }

        return Promise.reject(error)
    },
)


export {httpClient}