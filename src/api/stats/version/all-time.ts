import axios from "axios"

export default async function apiGetStatsVersionAllTime(version: string) {
	const { data } = await axios.get<{
		requests: Record<string, {
			total: number
			uniqueIps: number
		}>
	}>(`https://versions.mcjars.app/api/v2/requests/version/${version}`)

	return {
		type: 'all-time',
		requests: data.requests
	} as const
}