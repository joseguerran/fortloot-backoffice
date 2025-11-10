import Head from 'next/head'

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Página no encontrada</title>
      </Head>
      <main style={{padding: '2rem', textAlign: 'center'}}>
        <h1>404 - Página no encontrada</h1>
        <p>La página que buscas no existe.</p>
      </main>
    </>
  )
}
