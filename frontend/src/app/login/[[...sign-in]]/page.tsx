import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className='flex justify-center items-start w-full my-28'>
            <SignIn />
        </div>
    )
}