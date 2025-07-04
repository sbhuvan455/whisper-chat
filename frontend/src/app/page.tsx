import Link from "next/link"

export default function Component() {
    return (
        <div className="flex flex-col-reverse md:my-0">
            <main className="flex-1">
                <section className="w-full py-32 md:py-8">
                    <div className="container grid items-center md:gap-6 gap-20 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
                        <div className="space-y-4 flex flex-col items-center md:items-start">
                            <h1 className="text-4xl mx-auto md:text-left text-center font-bold tracking-tighter md:text-5xl/tight">
                                Real-Time Conversations,Anytime, Anywhere
                            </h1>
                            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Connect with friends, family, and communities in real-time. Our chat app makes it easy to stay in touch
                                and share moments together.
                            </p>
                            <Link
                                href="/join-room"
                                className="inline-flex mx-auto md:mx-0 h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                prefetch={false}
                            >
                                Start Chatting
                            </Link>
                        </div>
                        <img
                            src="/homeImage.png"
                            width={550}
                            height={550}
                            alt="Hero"
                            className="mx-auto md:my-0 my-10 aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                        />
                    </div>
                </section>
            </main>
        </div>
    )
}