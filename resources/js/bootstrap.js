import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['Accept'] = 'application/json';

window.axios.interceptors.request.use((config) => {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
    }

    return config;
});
