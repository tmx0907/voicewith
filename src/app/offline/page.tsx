export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="text-center space-y-4">
        <div className="text-6xl">📡</div>
        <h1 className="text-2xl font-bold text-gray-800">
          오프라인 상태입니다
        </h1>
        <p className="text-gray-600 max-w-xs">
          인터넷 연결을 확인하고 다시 시도해주세요.
          저장된 음성은 오프라인에서도 재생할 수 있습니다.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </main>
  )
}
