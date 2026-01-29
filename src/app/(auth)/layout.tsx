export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary-600">WithVoice</h1>
          <p className="mt-1 text-sm text-gray-500">
            사랑하는 사람의 목소리
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
