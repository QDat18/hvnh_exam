import axiosClient from "./axiosClient";
import type { Subject } from "../types";

const subjectApi = {
    getAll: (): Promise<Subject[]> => {
        return axiosClient.get('/subjects');
    },
    getChapters: (subjectId: string) => {
        return axiosClient.get('/content/chapters', { params: { subjectId } });
    }
};

export default subjectApi;