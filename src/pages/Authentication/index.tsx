import { Outlet } from "react-router-dom";

export default () => {
  return (
    <div>
      <div className="md:hidden">
        <img
          src="/Lyzr-Logo.svg"
          width={1280}
          height={843}
          alt="Authentication"
          className="block dark:hidden"
        />
      </div>
      <div className="container relative hidden min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img
              src="/Lyzr-Logo.svg"
              width={30}
              height={30}
              alt="Authentication"
              className="block dark:hidden mr-2"
            />
            Jazon
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p>
                Jazon is a AI Sales Development Representative who can help you
                automate your sales. Start by creating a new sales project.
              </p>
            </blockquote>
          </div>
        </div>

        <div className="lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};