import { Link } from "react-router-dom";
import Layout from "../components/Layout";

const PAGES = {
  privacy: {
    kicker: "Privacy",
    title: "How Tyyari uses your data",
    intro: "We collect only what we need to run practice, accounts, and Premium. We do not sell your answers.",
    sections: [
      {
        heading: "Account",
        body: "Email, name, and sign-in provider (Google or GitHub if you use them). We store a hashed password for email accounts, never the password itself.",
      },
      {
        heading: "Practice data",
        body: "The last answer you submit for a problem — code, canvas, quiz score, and HLD math/explanation — is saved to your account so sheets, streaks, and the dashboard stay in sync.",
      },
      {
        heading: "Online assessments",
        body: "The camera check runs in your browser so we can confirm a live feed. Tyyari does not upload or store the video. OA answers are stored separately from practice submits.",
      },
      {
        heading: "Payments",
        body: "Card details go to Stripe, not to Tyyari. We only store that your account is Premium and a payment reference after a successful checkout.",
      },
      {
        heading: "Mail",
        body: "We send verification, password reset, and (if you opt in later) prep reminders. You can ignore marketing — we do not send it in this phase.",
      },
    ],
  },
  terms: {
    kicker: "Terms",
    title: "Using Tyyari",
    intro: "Tyyari is an interview-prep workspace. It is not a job offer, a certified exam, or a substitute for a real company loop.",
    sections: [
      {
        heading: "Accounts",
        body: "You must use an email you control. One person per account. Do not share login details or try to break the code runner, gateway, or other users’ data.",
      },
      {
        heading: "Free and Premium",
        body: "Free includes the published practice library. Premium unlocks problems marked with a lock. Lifetime Premium is a one-time payment. Refunds follow Stripe’s and applicable consumer rules — write to the address on your receipt if a charge looks wrong.",
      },
      {
        heading: "Content and code",
        body: "Questions are for your own practice. Do not scrape or republish the library. Code you run is executed in an isolated runner with time and memory limits. Do not use it to attack other systems.",
      },
      {
        heading: "Online assessments",
        body: "Timed sets require a camera in the browser. Leaving or turning the camera off may block the exam UI. Results are for your practice, not an official score report.",
      },
      {
        heading: "Availability",
        body: "We aim to keep the app up, but local and hosted environments can go down for maintenance. Progress is stored when a submit succeeds — if a run fails, try again.",
      },
    ],
  },
};

export default function Legal({ kind }) {
  const page = PAGES[kind] || PAGES.privacy;
  return (
    <Layout publicPage>
      <section className="mx-auto max-w-2xl">
        <p className="label-caps">{page.kicker}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{page.title}</h1>
        <p className="mt-3 text-sm leading-6 text-mute">{page.intro}</p>
        <div className="mt-8 grid gap-6">
          {page.sections.map((section) => (
            <article key={section.heading} className="rounded-[24px] border border-line bg-card p-5">
              <h2 className="text-lg font-bold">{section.heading}</h2>
              <p className="mt-2 text-sm leading-6 text-mute">{section.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-mute">
          Questions? Sign in and use the dashboard, or start from the{" "}
          <Link to="/" className="font-semibold text-brand">landing page</Link>.
        </p>
      </section>
    </Layout>
  );
}
