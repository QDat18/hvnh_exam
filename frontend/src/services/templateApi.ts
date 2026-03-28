import axiosClient from "./axiosClient";

const templateApi = {
    create: (data: any) => {
        return axiosClient.post('/templates', data);
    },
    preview: (templateId: string) => {
        return axiosClient.post(`/templates/${templateId}/preview`);
    }
};

export default templateApi;