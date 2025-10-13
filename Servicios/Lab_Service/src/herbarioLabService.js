import axios from 'axios';

const GESTION_HERBARIO_URL = process.env.GESTION_HERBARIO_URL || 'http://localhost:3002';

export class HerbarioLabService {
  // Obtener muestras pendientes de clasificación
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
      return { success: false, error: error.response?.data?.error || 'Error obteniendo muestras' };
    }
  }

  // Obtener una muestra específica
  static async obtenerMuestra(id) {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/muestras/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo muestra:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo muestra' };
    }
  }

  // Actualizar muestra
  static async actualizarMuestra(id, datos) {
    try {
      const response = await axios.put(`${GESTION_HERBARIO_URL}/muestras/${id}`, datos);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error actualizando muestra:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error actualizando muestra' };
    }
  }

  // Crear clasificación taxonómica
  static async crearClasificacion(clasificacion) {
    try {
      const response = await axios.post(`${GESTION_HERBARIO_URL}/clasificaciones`, clasificacion);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creando clasificación:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error creando clasificación' };
    }
  }

  // Obtener clasificaciones de una muestra
  static async obtenerClasificacionesMuestra(muestraId) {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/clasificaciones/muestra/${muestraId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo clasificaciones:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo clasificaciones' };
    }
  }

  // Búsqueda taxonómica
  static async buscarTaxonomia(criterios) {
    try {
      const params = new URLSearchParams();
      Object.keys(criterios).forEach(key => {
        if (criterios[key] !== undefined) {
          params.append(key, criterios[key]);
        }
      });
      
      const response = await axios.get(`${GESTION_HERBARIO_URL}/taxonomia/buscar?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error en búsqueda taxonómica:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error en búsqueda taxonómica' };
    }
  }

  // Obtener familias
  static async obtenerFamilias() {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/taxonomia/familias`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo familias:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo familias' };
    }
  }

  // Obtener géneros por familia
  static async obtenerGeneros(familiaId) {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/taxonomia/generos/${familiaId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo géneros:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo géneros' };
    }
  }

  // Obtener especies por género
  static async obtenerEspecies(generoId) {
    try {
      const response = await axios.get(`${GESTION_HERBARIO_URL}/taxonomia/especies/${generoId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error obteniendo especies:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || 'Error obteniendo especies' };
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