import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

// Cliente único usando schema public (por defecto)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Para compatibilidad (mismo cliente)
export const supabaseCatalog = supabase;