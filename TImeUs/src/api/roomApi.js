import { supabase } from '../lib/supabaseClient';

// 1. 방 생성
export async function createRoom(roomData) {
  const { data, error } = await supabase
    .from('rooms')
    .insert([roomData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 2. 방 정보 및 등록된 참여자 전체 조회
export async function getRoomDetails(roomId) {
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError) throw roomError;

  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('room_id', roomId);

  if (scheduleError) throw scheduleError;

  return { room, schedules };
}

// 3. 특정 유저의 기존 일정 및 메모 조회 (로그인 검증 및 수정용)
export async function getUserData(roomId, userName) {
  const { data: schedule, error: schedError } = await supabase
    .from('schedules')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_name', userName)
    .maybeSingle();

  if (schedError) throw schedError;

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_name', userName);

  if (notesError) throw notesError;

  return { schedule, notes };
}

// 4. 내 일정 저장 / 수정 (Upsert)
export async function saveUserSchedule({ roomId, userName, pin, timeSlots }) {
  // 기존에 등록된 사용자가 있는지 확인
  const { data: existing } = await supabase
    .from('schedules')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_name', userName)
    .maybeSingle();

  if (existing) {
    // 기존 일정 수정 (Update)
    const { data, error } = await supabase
      .from('schedules')
      .update({
        pin,
        time_slots: timeSlots,
      })
      .eq('id', existing.id)
      .select();

    if (error) throw error;
    return data;
  } else {
    // 신규 참여자 일정 등록 (Insert)
    const { data, error } = await supabase
      .from('schedules')
      .insert([{
        room_id: roomId,
        user_name: userName,
        pin,
        time_slots: timeSlots,
      }])
      .select();

    if (error) throw error;
    return data;
  }
}

// 5. 메모 저장 (수정 시 기존 메모 삭제 후 새로 등록)
export async function saveUserNotes(roomId, userName, notesList) {
  // 기존 작성한 메모 삭제
  await supabase
    .from('notes')
    .delete()
    .eq('room_id', roomId)
    .eq('user_name', userName);

  // 새 메모 목록 추가
  if (notesList && notesList.length > 0) {
    const { data, error } = await supabase
      .from('notes')
      .insert(notesList);

    if (error) throw error;
    return data;
  }
  return [];
}