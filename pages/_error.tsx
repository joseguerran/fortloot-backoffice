import Head from 'next/head'

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <>
      <Head>
        <title>{statusCode ? `${statusCode} error` : 'Error'}</title>
      </Head>
      <main style={{padding: '2rem', textAlign: 'center'}}>
        <h1>{statusCode ? `Error ${statusCode}` : 'Ocurrió un error'}</h1>
        <p>Intenta nuevamente más tarde.</p>
      </main>
    </>
  )
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
