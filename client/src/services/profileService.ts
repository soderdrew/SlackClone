import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { store } from '../store';
import { Profile } from '../types/user';
import { RootState } from '../store/store';

class ProfileService {
  private baseUrl = `${API_BASE_URL}/api/profiles`;

  async updateBio(bio: string): Promise<Profile> {
    try {
      const state = store.getState() as RootState;
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.patch<{ profile: Profile }>(
        `${this.baseUrl}/bio`,
        { bio },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data.profile;
    } catch (error) {
      console.error('Error updating bio:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService(); 