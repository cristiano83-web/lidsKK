// Importa a função de criação do client Supabase via CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Cria o client com a URL e a chave fornecidas
export const supabase = createClient(
  'https://egqgimenkefjmmtysatj.supabase.co',
   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncWdpbWVua2Vmam1tdHlzYXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTk0NTEsImV4cCI6MjA4NjI5NTQ1MX0.faRdHlFIyDxHy7lQIq74YkuLBuKdKodAMQYcqws2jCU',
)