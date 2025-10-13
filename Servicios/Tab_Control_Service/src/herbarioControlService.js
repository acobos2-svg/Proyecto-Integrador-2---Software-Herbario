import axios from 'axios';

const GESTION_HERBARIO_URL = process.env.GESTION_HERBARIO_URL || 'http://localhost:3002';

export class HerbarioControlService {
  // Obtener estadísticas generales
  static async obtenerEstadisticasGenerales() {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/estadisticas/resumen`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo estadísticas generales:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo estadísticas' };
    }
  }

  // Obtener estadísticas por ubicación
  static async obtenerEstadisticasPorUbicacion() {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/estadisticas/por-ubicacion`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo estadísticas por ubicación:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo estadísticas por ubicación' };
    }
  }

  // Obtener muestras pendientes para resumen
  static async obtenerMuestrasPendientes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== undefined) {
          params.append(key, filtros[key]);
        }
      });
      
      const response = await axios.get(`${GESTION_HERBARIO_URL}/muestras/pendientes?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo muestras pendientes:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo muestras pendientes' };
    }
  }

  // Obtener paquetes recientes
  static async obtenerPaquetesRecientes(limit = 10) {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/paquetes?limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo paquetes recientes:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo paquetes recientes' };
    }
  }

  // Obtener conglomerados para filtros
  static async obtenerConglomerados() {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/ubicaciones/conglomerados`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo conglomerados:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo conglomerados' };
    }
  }

  // Obtener taxonomía para reportes
  static async obtenerFamilias() {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/taxonomia/familias`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo familias:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo familias' };
    }
  }

  // Obtener herbarios
  static async obtenerHerbarios() {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/herbarios`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo herbarios:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo herbarios' };
    }
  }
}