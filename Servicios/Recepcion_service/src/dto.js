// DTOs y validaciones para el servicio de recepción

export function validatePaqueteDTO(body) {
  const errors = [];
  
  if (!body.evento_coleccion) {
    errors.push('evento_coleccion es requerido');
  } else {
    if (!body.evento_coleccion.descripcion) {
      errors.push('evento_coleccion.descripcion es requerido');
    }
    if (!body.evento_coleccion.id_conglomerado) {
      errors.push('evento_coleccion.id_conglomerado es requerido');
    }
  }

  if (!body.num_paquete) {
    errors.push('num_paquete es requerido');
  }

  if (!body.muestras || !Array.isArray(body.muestras) || body.muestras.length === 0) {
    errors.push('muestras debe ser un array no vacío');
  } else {
    body.muestras.forEach((muestra, index) => {
      if (!muestra.num_individuo) {
        errors.push(`muestras[${index}].num_individuo es requerido`);
      }
      if (!muestra.colector) {
        errors.push(`muestras[${index}].colector es requerido`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createPaqueteInsert(body) {
  const { evento_coleccion, num_paquete, cantidad_ejemplares, fecha_envio, fecha_recibido_herbario, observaciones_generales } = body;
  
  return {
    evento: {
      descripcion: evento_coleccion.descripcion,
      archivo_pdf: evento_coleccion.archivo_pdf || null,
      fecha_coleccion_inicio: evento_coleccion.fecha_coleccion_inicio || null,
      fecha_coleccion_fin: evento_coleccion.fecha_coleccion_fin || null,
      id_conglomerado: evento_coleccion.id_conglomerado
    },
    paquete: {
      num_paquete,
      cantidad_ejemplares: cantidad_ejemplares || body.muestras?.length,
      fecha_envio: fecha_envio || null,
      fecha_recibido_herbario: fecha_recibido_herbario || new Date().toISOString().split('T')[0],
      observaciones_generales: observaciones_generales || null
    },
    muestras: body.muestras.map(muestra => ({
      num_individuo: muestra.num_individuo,
      colector: muestra.colector,
      num_coleccion: muestra.num_coleccion || null,
      observaciones: muestra.observaciones || null,
      fecha_coleccion: muestra.fecha_coleccion || null
    }))
  };
}