import Studio from './studio';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return <Studio user={user?{name:user.fullName||user.email,email:user.email}:null}/>}
