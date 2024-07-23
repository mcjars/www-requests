import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import useSWR from "swr"
import apiGetTypes from "@/api/types"
import apiGetVersions from "@/api/versions"
import apiGetStats from "@/api/stats"
import { Skeleton } from "@/components/ui/skeleton"
import { BooleanParam, NumberParam, StringParam, useQueryParam } from "use-query-params"
import { TbBrandGithub, TbLink } from "react-icons/tb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import apiGetStatsTypeAllTime from "@/api/stats/type/all-time"
import apiGetStatsTypeMonth from "@/api/stats/type/month"
import apiGetStatsVersionAllTime from "@/api/stats/version/all-time"
import apiGetStatsVersionMonth from "@/api/stats/version/month"

export default function App() {
  const [ type, setType ] = useQueryParam('type', StringParam)
  const [ includeSnapshots, setIncludeSnapshots ] = useQueryParam('snapshots', BooleanParam)
  const [ version, setVersion ] = useQueryParam('version', StringParam)
  const [ allTime, setAllTime ] = useQueryParam('allTime', BooleanParam)
  const [ view, setView ] = useQueryParam('view', StringParam)
  const [ year, setYear ] = useQueryParam('year', NumberParam)
  const [ month, setMonth ] = useQueryParam('month', NumberParam)
  const [ typeRequestStats, setTypeRequestStats ] = useState<Awaited<ReturnType<typeof apiGetStatsTypeMonth>> | Awaited<ReturnType<typeof apiGetStatsTypeAllTime>>>()
  const [ versionRequestStats, setVersionRequestStats ] = useState<Awaited<ReturnType<typeof apiGetStatsVersionMonth>> | Awaited<ReturnType<typeof apiGetStatsVersionAllTime>>>()

  const { data: types } = useSWR(
    ['types'],
    () => apiGetTypes(),
    { revalidateOnFocus: false, revalidateIfStale: false }
  )

  const { data: stats } = useSWR(
    ['stats'],
    () => apiGetStats(),
    { revalidateOnFocus: false, revalidateIfStale: false }
  )

  const { data: versions } = useSWR(
    ['versions', 'VANILLA', type !== 'VANILLA'],
    () => type ? apiGetVersions('VANILLA') : undefined,
    { revalidateOnFocus: false, revalidateIfStale: false }
  )

  useEffect(() => {
    if (types && !type) {
      setType(types[0].identifier)
    }
  }, [ types ])

  useEffect(() => {
    if (!year) setYear(new Date().getFullYear())
    if (!month) setMonth(new Date().getMonth() + 1)
    if (!view) setView('root')
  }, [ year, month, view ])

  useEffect(() => {
    if (!version && type && year && month) {
      if (allTime) {
        apiGetStatsTypeAllTime(type)
          .then(setTypeRequestStats)
      } else {
        apiGetStatsTypeMonth(type, year, month)
          .then(setTypeRequestStats)
      }
    } else if (version && year && month) {
      if (allTime) {
        apiGetStatsVersionAllTime(version)
          .then(setVersionRequestStats)
      } else {
        apiGetStatsVersionMonth(version, year, month)
          .then(setVersionRequestStats)
      }
    }
  }, [ version, type, allTime, year, month ])

  useEffect(() => {
    if (!version && (view === 'total' || view === 'all-types')) {
      setView('root')
    } else if (version && view !== 'total' && view !== 'all-types') {
      setView('total')
    }
  }, [ version, view ])

  useEffect(() => {
    if (version) setType(undefined)
  }, [ version ])

  return (
    <>
      <nav className={'flex flex-row items-center justify-between px-4 py-2 border-b-2 border-x-2 rounded-b-xl w-full max-w-7xl h-16 mx-auto'}>
        <div className={'flex flex-row h-full items-center'}>
          <img src={'https://s3.mcjars.app/icons/vanilla.png'} alt={'Logo'} className={'h-12 w-12'} />
          <div className={'flex flex-col ml-2'}>
            <h1 className={'text-xl font-semibold'}>MCJars</h1>
            {stats && (
              <p className={'text-xs -mt-1'}>{stats.builds} Total Builds, {stats.hashes} Hashes</p>
            )}
          </div>
        </div>
        <div className={'md:flex hidden space-x-1 flex-row h-full items-center'}>
          <a href={'https://versions.mcjars.app'} target={'_blank'} rel={'noopener noreferrer'}>
            <Button>
              <TbLink size={24} className={'mr-1'} />
              API Docs
            </Button>
          </a>
          <a href={'https://github.com/mcjars'} target={'_blank'} rel={'noopener noreferrer'}>
            <Button>
              <TbBrandGithub size={24} className={'mr-1'} />
              GitHub
            </Button>
          </a>
        </div>
      </nav>
      <main className={'p-4 pt-0 grid xl:grid-cols-8 xl:grid-rows-1 grid-rows-8 gap-2 w-full h-[calc(100vh-5rem)] max-w-7xl mx-auto'}>
        <div className={'flex flex-col xl:col-span-2 xl:row-span-1 row-span-2 overflow-scroll xl:h-[calc(100vh-5rem)]'}>
          {versions && types ? (
            <>
              {versions.some((v) => v.type === 'SNAPSHOT') && (
                <Button
                  onClick={() => setIncludeSnapshots(!includeSnapshots)}
                  className={cn('my-1', includeSnapshots ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400')}
                >
                  Include Snapshots
                </Button>
              )}
              <Button
                key={'all'}
                onClick={() => setVersion(undefined)}
                disabled={!version}
                className={'h-16 min-h-[4rem] my-1 flex flex-row items-center justify-between w-full'}
              >
                <p className={'text-center w-full text-md'}>Filter by Type</p>
              </Button>
              {versions.filter((v) => !v.type || (v.latest.versionId ?? v.latest.projectVersionId) === version || v.type === 'RELEASE' || (v.type === 'SNAPSHOT' && includeSnapshots)).map((v) => (
                <Button
                  key={v.latest.versionId ?? v.latest.projectVersionId}
                  disabled={(v.latest.versionId ?? v.latest.projectVersionId) === version}
                  onClick={() => setVersion(v.latest.versionId ?? v.latest.projectVersionId)}
                  className={'h-16 my-1 flex flex-row items-center justify-between w-full text-right'}
                >
                  <img src={types.find((t) => t.identifier === 'VANILLA')?.icon} alt={'VANILLA'} className={'h-12 w-12 mr-2 rounded-md'} />
                  <span>
                    <h1 className={'md:text-xl text-lg font-semibold'}>{v.latest.versionId ?? v.latest.projectVersionId}</h1>
                    <span className={'grid grid-cols-2 mr-0'}>
                      <p>{v.builds} Build{v.builds === 1 ? '' : 's'}</p>
                      <p className={'w-fit text-right pl-2'}>Requires Java {v.java}</p>
                    </span>
                  </span>
                </Button>
              ))}
            </>
          ) : (
            <>
              <Skeleton className={'h-16 my-1'} />
              <Skeleton className={'h-16 my-1'} />
              <Skeleton className={'h-16 my-1'} />
              <Skeleton className={'h-16 my-1'} />
            </>
          )}
        </div>
        {!version ? (
          <>
            <div className={'flex flex-col xl:col-span-3 xl:row-span-1 row-span-3 overflow-scroll xl:h-[calc(100vh-5rem)]'}>
              {types ? (
                <>
                  {types.map((t) => (
                    <Button
                      key={t.identifier}
                      disabled={t.identifier === type}
                      onClick={() => setType(t.identifier)}
                      className={'h-fit my-1 flex flex-row items-center justify-between w-full text-right'}
                    >
                      <img src={t.icon} alt={t.name} className={'h-16 w-16 mr-2 rounded-md'} />
                      <span>
                        <h1 className={'md:text-xl text-lg font-semibold'}>{t.name}</h1>
                        <p className={'mb-[6px]'}>
                          {t.categories.map((c) => (
                            <span key={t.name + c} className={'-md:hidden text-xs mr-1 bg-blue-500 text-white h-6 p-1 rounded-md'}>{c}</span>
                          ))}
                          {t.experimental && <span className={'text-xs mr-1 bg-yellow-500 text-white h-6 p-1 rounded-md'}>experimental</span>}
                          {t.deprecated && <span className={'text-xs mr-1 bg-red-500 text-white h-6 p-1 rounded-md'}>deprecated</span>}
                          {t.builds} Build{t.builds === 1 ? '' : 's'}
                        </p>
                        <span className={'md:block hidden'}>
                          {t.compatibility.map((c) => (
                            <span key={t.name + c} className={'text-xs mr-1 bg-green-500 text-white h-6 p-1 rounded-md'}>{c}</span>
                          ))}
                          {t.compatibility.length > 0 && 'compatibility'}
                        </span>
                      </span>
                    </Button>
                  ))}
                </>
              ) : (
                <>
                  <Skeleton className={'h-16 my-1'} />
                  <Skeleton className={'h-16 my-1'} />
                  <Skeleton className={'h-16 my-1'} />
                  <Skeleton className={'h-16 my-1'} />
                  <Skeleton className={'h-16 my-1'} />
                </>
              )}
            </div>
            <div className={'flex flex-col xl:col-span-3 xl:row-span-1 row-span-3 overflow-scroll xl:h-[calc(100vh-5rem)]'}>
              {versions && types ? (
                <>
                  <div className={'grid grid-cols-4 gap-1 w-full mt-1'}>
                    <span className={'flex flex-row w-full items-center'}>
                      <Switch id={'all-time'} checked={Boolean(allTime)} onClick={() => setAllTime((a) => !a)} />
                      <label htmlFor={'all-time'} className={'ml-2'}>All Time</label>
                    </span>
                    <Select onValueChange={(v) => setYear(parseInt(v))} value={year?.toString()}>
                      <SelectTrigger className={'col-span-1'} disabled={Boolean(allTime)}>
                        <SelectValue placeholder={'Year'} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => (
                          <SelectItem key={i} value={String(i + 2024)}>{i + 2024}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(v) => setMonth(parseInt(v))} value={month?.toString()}>
                      <SelectTrigger className={'col-span-2'} disabled={Boolean(allTime)}>
                        <SelectValue placeholder={'Month'} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, i))}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={'border border-gray-800 my-1 w-full'} />

                  {typeRequestStats ? (
                    Array.isArray(typeRequestStats) ? ( // Month
                      <>
                        <span className={'grid grid-cols-3 w-full items-center'}>
                          <Select onValueChange={(v) => setView(v)} value={view ?? 'root'}>
                            <SelectTrigger className={'col-span-1'}>
                              <SelectValue placeholder={'View'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={'root'}>Root</SelectItem>
                              {[...new Set(typeRequestStats.map((data) => Object.keys(data.versions)).flat())].sort().reverse().map((v) => (
                                <SelectItem key={v} value={v}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className={'col-span-2 flex flex-col'}>
                            <h1 className={'text-xl font-semibold text-right col-span-2'}>Requests ({view === 'root' ? 'Root' : view})</h1>
                            <p className={'text-right text-sm text-gray-500 -mt-1'}>
                              Total: {typeRequestStats.reduce((acc, data) => acc + (view === 'root' ? data.root.total : data.versions[view ?? '1']?.total ?? 0), 0)}
                            </p>
                          </div>
                        </span>
                        <ChartContainer config={{}} className={'w-full min-h-[600px]'}>
                          <BarChart layout={'vertical'} accessibilityLayer data={typeRequestStats.map((data) => ({
                            day: data.day,
                            total: view === 'root' ? data.root.total : data.versions[view ?? '1']?.total ?? 0
                          }))}>
                            <CartesianGrid vertical={true} horizontal={false} />
                            <YAxis dataKey={'day'} type={'category'} />
                            <XAxis type={'number'} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar barSize={32} dataKey={'total'} fill={'#2563eb'} radius={4} />
                          </BarChart>
                        </ChartContainer>
                      </>
                    ) : (
                      <>
                        <div className={'w-full flex flex-col'}>
                          <h1 className={'text-xl font-semibold text-right'}>Requests by Version</h1>
                          <p className={'text-right text-sm text-gray-500 -mt-1'}>
                            Root: {typeRequestStats.root.total},{' '}
                            Total: {Object.values(typeRequestStats.versions).reduce((acc, data) => acc + data.total, 0)}
                          </p>
                        </div>
                        <ChartContainer config={{}} className={'w-full h-full min-h-[600px]'}>
                          <BarChart layout={'vertical'} accessibilityLayer data={Object.entries(typeRequestStats.versions).map(([ version, data ]) => ({
                            version,
                            total: data.total
                          }))}>
                            <CartesianGrid vertical={true} horizontal={false} />
                            <YAxis dataKey={'version'} type={'category'} />
                            <XAxis type={'number'} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar barSize={32} dataKey={'total'} fill={'#2563eb'} radius={4} />
                          </BarChart>
                        </ChartContainer>
                      </>
                    )
                  ) : (
                    <>
                      <Skeleton className={'h-16 my-1'} />
                      <Skeleton className={'h-16 my-1'} />
                    </>
                  )}
                </>
              ) : (
                <>
                  <Skeleton className={'h-16 my-1'} />
                  <Skeleton className={'h-16 my-1'} />
                </>
              )}
            </div>
          </>
        ) : (
          <div className={'flex flex-col xl:col-span-6 xl:row-span-1 row-span-6 overflow-scroll xl:h-[calc(100vh-5rem)]'}>
            <div className={'grid grid-cols-4 gap-1 w-full mt-1'}>
              <span className={'flex flex-row w-full items-center'}>
                <Switch id={'all-time'} checked={Boolean(allTime)} onClick={() => setAllTime((a) => !a)} />
                <label htmlFor={'all-time'} className={'ml-2'}>All Time</label>
              </span>
              <Select onValueChange={(v) => setYear(parseInt(v))} value={year?.toString()}>
                <SelectTrigger className={'col-span-1'} disabled={Boolean(allTime)}>
                  <SelectValue placeholder={'Year'} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => (
                    <SelectItem key={i} value={String(i + 2024)}>{i + 2024}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => setMonth(parseInt(v))} value={month?.toString()}>
                <SelectTrigger className={'col-span-2'} disabled={Boolean(allTime)}>
                  <SelectValue placeholder={'Month'} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, i))}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={'border border-gray-800 my-1 w-full'} />

            {versionRequestStats && types ? (
              versionRequestStats.type === 'month' ? (
                <>
                  <span className={'grid grid-cols-3 w-full items-center'}>
                    <Select onValueChange={(v) => setView(v)} value={view ?? 'root'}>
                      <SelectTrigger className={'col-span-1'}>
                        <SelectValue placeholder={'View'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={'total'}>Total</SelectItem>
                        <SelectItem value={'all-types'}>All Types</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className={'col-span-2 flex flex-col'}>
                      <h1 className={'text-xl font-semibold text-right col-span-2'}>Requests ({view === 'total' ? 'Total' : 'All Types'})</h1>
                      <p className={'text-right text-sm text-gray-500 -mt-1'}>
                        Total: {Object.values(versionRequestStats.requests).reduce((acc, data) => acc + data.reduce((acc, data) => acc + data.total, 0), 0)}
                      </p>
                    </div>
                  </span>
                  {view === 'total' ? (
                    <ChartContainer config={{}} className={'w-full min-h-[600px]'}>
                      <BarChart layout={'vertical'} accessibilityLayer data={Object.entries(versionRequestStats.requests).map(([ type, data ]) => ({
                        type,
                        total: data.reduce((acc, data) => acc + data.total, 0)
                      })).sort((a, b) => b.total - a.total)}>
                        <CartesianGrid vertical={true} horizontal={false} />
                        <YAxis dataKey={'type'} type={'category'} width={96} />
                        <XAxis type={'number'} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar barSize={32} dataKey={'total'} fill={'#2563eb'} radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <ChartContainer config={{}} className={'w-full min-h-[600px]'}>
                      <BarChart layout={'vertical'} accessibilityLayer data={Object.values(versionRequestStats.requests)[0].map((day) => ({
                        day: day.day,
                        ...Object.fromEntries(Object.keys(versionRequestStats.requests).map((type) => [
                          type, versionRequestStats.requests[type].find((d) => d.day === day.day)?.total || null
                        ]))
                      }))}>
                        <CartesianGrid vertical={true} horizontal={false} />
                        <YAxis dataKey={'day'} type={'category'} />
                        <XAxis type={'number'} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {types.map((type) => (
                          <Bar
                            key={type.name}
                            stackId={'types'}
                            barSize={32}
                            dataKey={type.name.toUpperCase()}
                            fill={type.color}
                            radius={2}
                          />
                        ))}
                      </BarChart>
                    </ChartContainer>
                  )}
                </>
              ) : (
                <>
                  <div className={'w-full flex flex-col'}>
                    <h1 className={'text-xl font-semibold text-right'}>Requests by Type</h1>
                    <p className={'text-right text-sm text-gray-500 -mt-1'}>
                      Total: {Object.values(versionRequestStats.requests).reduce((acc, data) => acc + data.total, 0)}
                    </p>
                  </div>
                  <ChartContainer config={{}} className={'w-full min-h-[600px]'}>
                    <BarChart layout={'vertical'} accessibilityLayer data={Object.entries(versionRequestStats.requests).map(([ type, data ]) => ({
                      type,
                      total: data.total
                    })).sort((a, b) => b.total - a.total)}>
                      <CartesianGrid vertical={true} horizontal={false} />
                      <YAxis width={96} dataKey={'type'} type={'category'} />
                      <XAxis type={'number'} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar barSize={32} dataKey={'total'} fill={'#2563eb'} radius={4} />
                    </BarChart>
                  </ChartContainer>
                </>
              )
            ) : (
              <>
                <Skeleton className={'h-16 my-1'} />
                <Skeleton className={'h-16 my-1'} />
              </>
            )}
          </div>
        )}
      </main>
    </>
  )
}