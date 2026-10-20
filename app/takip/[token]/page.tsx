export const metadata={robots:{index:false,follow:false},referrer:'no-referrer' as const};
import Tracking from './tracking';export default async function Page({params}:{params:Promise<{token:string}>}){return <Tracking token={(await params).token}/>}
