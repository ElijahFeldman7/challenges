import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos, error } = await supabase.from('todos').select()

  if (error) {
    return <div>Error loading todos: {error.message}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Todos Test</h1>
      <ul>
        {todos?.map((todo) => (
          <li key={todo.id} className="mb-2 p-2 border rounded">{todo.name}</li>
        ))}
      </ul>
      {todos?.length === 0 && <p>No todos found. Make sure the table exists and is populated.</p>}
    </div>
  )
}
