import html2canvas from 'html2canvas'
import Head from 'next/head'
import Image from 'next/image'
import { type FormEventHandler, useEffect, useRef, useState } from 'react'

import ErrorMessage from '../components/ErrorMessage'
import GenerateButton from '../components/GenerateButton'
import GitHubButton from '../components/GitHubButton'
import Graph from '../components/Graph'
import GraphFooter from '../components/GraphFooter'
import GraphHeader from '../components/GraphHeader'
import Loading from '../components/Loading'
import ThemeSelector from '../components/ThemeSelector'
import mockData from '../mock-data'
import type { ErrorData, GraphData } from '../types'

export default function HomePage() {
  const container = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const [username, setUsername] = useState('')
  const [graphData, setGraphData] = useState<GraphData>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorData>()

  const handleDownload = async () => {
    if (container.current && graphData) {
      const canvas = await html2canvas(container.current, {
        backgroundColor: null,
      })
      const dataURL = canvas.toDataURL()

      const trigger = document.createElement('a')
      trigger.href = dataURL
      trigger.download = `${graphData.username}.png`
      trigger.click()
    }
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()

    if (username) {
      try {
        inputRef.current!.blur()
        setError(undefined)
        setLoading(true)
        const res = await fetch(`/api/${username}`)
        console.log(res)
        if (res.status >= 400) {
          const error: ErrorData = await res.json()
          setError({ message: error.message })
        } else {
          const data: GraphData = await res.json()
          console.log(data)
          setGraphData(data)
        }
      } catch (e) {
        setGraphData(undefined)
        setError({})
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <Head>
        <title>Green Wall · Review your GitHub contributions</title>
      </Head>

      <div className="md:mx-auto md:min-w-content md:max-w-content">
        <header>
          <div className="flex h-header items-center">
            <div className="flex select-none items-center text-xl font-bold">
              <Image height={24} src="/favicon.svg" width={24} />
              <span className="ml-3">Green Wall</span>
            </div>

            <GitHubButton />
          </div>
        </header>

        <main className="pb-16 pt-14">
          <h1 className="mx-auto text-center font-bold md:w-2/3 md:text-5xl">
            Generate the contributions you have made on GitHub over the years.
          </h1>

          <form className="py-16" onSubmit={handleSubmit}>
            <div className="flex h-[2.8rem] items-center justify-center gap-x-5">
              <input
                ref={inputRef}
                required
                className="inline-block h-full overflow-hidden rounded-lg bg-gray-100 px-5 text-center text-lg text-main-800 caret-main-500 shadow-main-300 transition-colors duration-300 placeholder:select-none placeholder:text-main-400 focus:bg-white focus:shadow-[0_0_1.5rem_var(--tw-shadow-color)] focus:outline-none"
                name="username"
                placeholder="GitHub Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <GenerateButton loading={loading} type="submit" />
            </div>
          </form>

          {!error ? (
            <Loading active={loading}>
              {graphData && (
                <>
                  <div className="flex items-center justify-center gap-x-5 py-5">
                    <button
                      className="inline-flex h-full items-center rounded-md bg-main-200 py-2 px-4 font-medium text-main-500 focus:outline-none disabled:cursor-default"
                      onClick={handleDownload}
                    >
                      Save as Image
                    </button>
                    <ThemeSelector
                      onChange={(theme) => {
                        container.current?.style.setProperty('--graph-text-color', theme.textColor)
                        container.current?.style.setProperty('--graph-bg', theme.background)

                        theme.levelColors.forEach((color, i) => {
                          container.current?.style.setProperty(`--level-${i}`, color)
                        })
                      }}
                    />
                  </div>
                  <div className="flex justify-center overflow-x-auto">
                    <div
                      ref={container}
                      className="graph-container inline-flex flex-col justify-center p-5"
                    >
                      <GraphHeader username={graphData.username} />

                      <div className="flex flex-col gap-y-5">
                        {graphData.data?.map((data, i) => (
                          <Graph key={`${i}`} data={data} />
                        ))}
                      </div>

                      <GraphFooter />
                    </div>
                  </div>
                </>
              )}
            </Loading>
          ) : (
            <ErrorMessage message={error.message} />
          )}
        </main>

        {/* <footer className="sticky top-[100vh] py-3 text-center text-sm text-main-400"></footer> */}
      </div>
    </>
  )
}
