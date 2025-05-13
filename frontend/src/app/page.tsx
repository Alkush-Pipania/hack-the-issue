import { redirect } from 'next/navigation'


const page = () => {
  redirect('/signin')
  return (
    <></>
  )
}

export default page