import { API_BASE_URL } from "../config/api";

export const usersAPI = {
    async getAll() {
        const response = await fetch(`${API_BASE_URL}/users`, {
            credentials: "include",
        });

        if (!response.ok) {
            // Lesen der Antwort als Text, um 'Unexpected end of JSON input' zu vermeiden
            const errorText = await response.text();
            let errorMessage = "Failed to fetch users";
            
            // Versuch, den Text als JSON zu parsen (falls der Server doch eine Fehlermeldung sendet)
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Wenn kein JSON, den reinen HTTP-Status verwenden
                errorMessage += ` (Status: ${response.status})`;
            }
            
            throw new Error(errorMessage);
        }
        
        // Nur .json() aufrufen, wenn response.ok ist
        return response.json();
    },

    async delete(userId: number) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "DELETE",
            credentials: "include",
        });

        // Wichtig: Beim DELETE kann der Server 204 No Content senden, was kein JSON ist.
        if (response.status === 204) {
            return { success: true, message: "User deleted" };
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = "Failed to delete user";
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage += ` (Status: ${response.status})`;
            }
            throw new Error(errorMessage);
        }
        
        return response.json();
    }
};
