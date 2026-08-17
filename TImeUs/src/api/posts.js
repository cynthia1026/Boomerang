import { supabase } from '../lib/supabaseClient';

// 데이터 목록 가져오기
export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  return data;
}

// 새 데이터 추가
export async function createPost(title, content) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ title, content }]);

  if (error) throw error;
  return data;
}