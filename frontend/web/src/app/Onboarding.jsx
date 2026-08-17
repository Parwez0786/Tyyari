import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { contentApi, userApi } from "../services/api";

const roles = ["SDE1", "SDE2", "Frontend", "Backend"];
const experiences = ["Fresher", "1-2", "2-4", "4+"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["companies"], queryFn: contentApi.companies });
  const companies = data?.data ?? [];
  const [targetRole, setTargetRole] = useState("SDE1");
  const [experience, setExperience] = useState("1-2");
  const [selected, setSelected] = useState(["Amazon", "Google", "Microsoft"]);
  const [error, setError] = useState("");

  function toggle(name) {
    setSelected((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await userApi.updateProfile({ targetRole, experience, onboarded: true });
      await userApi.saveGoals({ targetRole, targetCompanies: selected, dailyGoalMinutes: 120 });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Layout>
      <form onSubmit={onSubmit} className="panel">
        <p className="label-caps">Edit profile</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">What are you preparing for?</h1>
        <p className="mt-2 text-sm text-mute">We’ll tailor the practice list. You can change this later.</p>
        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-4">
          {roles.map((role) => (
            <button type="button" key={role} onClick={() => setTargetRole(role)} className={`rounded-card border px-4 py-3 text-sm ${targetRole === role ? "border-brand bg-orange-50 font-medium text-brand dark:bg-orange-950/40" : "border-line"}`}>
              {role}
            </button>
          ))}
        </div>
        <p className="label-caps mt-8">Target companies</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {companies.map((c) => (
            <button type="button" key={c.id} onClick={() => toggle(c.name)} className={`rounded-full border px-4 py-1.5 text-sm ${selected.includes(c.name) ? "border-brand bg-brand text-white" : "border-line"}`}>
              {c.name}
            </button>
          ))}
        </div>
        <p className="label-caps mt-8">Experience</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {experiences.map((exp) => (
            <button type="button" key={exp} onClick={() => setExperience(exp)} className={`rounded-full border px-4 py-1.5 text-sm ${experience === exp ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "border-line"}`}>
              {exp}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-hard">{error}</p>}
        <button className="btn-black mt-8">Continue to dashboard</button>
      </form>
    </Layout>
  );
}
