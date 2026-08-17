import { useState } from 'react'
import type { Page, RoomInfo } from './types'
import OpeningPage from './pages/OpeningPage'
import LoginPage from './pages/LoginPage'
import CreateRoomPage from './pages/CreateRoomPage'
import AvailInputPage from './pages/AvailInputPage'
import ResultPage from './pages/ResultPage'

const DEFAULT_ROOM: RoomInfo = {
  name: '부메랑',
  place: '비대면(ZOOM)',
  startDate: '2026/08/11',
  endDate: '2026/08/15',
}

export default function App() {
  const [page, setPage] = useState<Page>('opening')
  const [userName, setUserName] = useState('')
  const [roomInfo, setRoomInfo] = useState<RoomInfo>(DEFAULT_ROOM)

  return (
    <>
      {page === 'opening' && (
        <OpeningPage
          onJoin={() => setPage('login')}
          onCreate={() => setPage('create')}
        />
      )}
      {page === 'login' && (
        <LoginPage
          onBack={() => setPage('opening')}
          onNext={name => { setUserName(name); setPage('availability') }}
        />
      )}
      {page === 'create' && (
        <CreateRoomPage
          onBack={() => setPage('opening')}
          onNext={(name, room) => { setUserName(name); setRoomInfo(room); setPage('availability') }}
        />
      )}
      {page === 'availability' && (
        <AvailInputPage
          onBack={() => setPage('opening')}
          onSubmit={() => setPage('result')}
          userName={userName}
          roomInfo={roomInfo}
        />
      )}
      {page === 'result' && (
        <ResultPage
          onBack={() => setPage('opening')}
          roomInfo={roomInfo}
        />
      )}
    </>
  )
}
