import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, LayoutTemplate, Network, Puzzle } from "lucide-react";
import { TargetRole } from "../data/enums";
import { authApi, contentApi, userApi } from "../services/api";

export const ONBOARD_ROLES = [
  {
    key: TargetRole.SDE1,
    title: "SDE-1",
    hook: "DSA, LLD, and CS fundamentals.",
    Icon: Code2,
    accent: "from-emerald-500/20 to-teal-500/5",
  },
  {
    key: TargetRole.SDE2,
    title: "SDE-2",
    hook: "System design plus deeper LLD.",
    Icon: Network,
    accent: "from-orange-500/20 to-amber-500/5",
  },
  {
    key: TargetRole.FRONTEND,
    title: "Frontend",
    hook: "UI machine-coding and React rounds.",
    Icon: LayoutTemplate,
    accent: "from-fuchsia-500/20 to-pink-500/5",
  },
  {
    key: TargetRole.BACKEND,
    title: "Backend",
    hook: "APIs, data, and service design.",
    Icon: Puzzle,
    accent: "from-sky-500/20 to-cyan-500/5",
  },
];

export const EXPERIENCES = [
  { key: "Fresher", title: "Fresher", hint: "Campus or first loop" },
  { key: "1-2", title: "1–2 years", hint: "Early SDE" },
  { key: "2-4", title: "2–4 years", hint: "Mid-level" },
  { key: "4+", title: "4+ years", hint: "Senior track" },
];

export const DAILY = [
  { minutes: 45, label: "45 min", hint: "Light day" },
  { minutes: 90, label: "90 min", hint: "Steady" },
  { minutes: 120, label: "2 hours", hint: "Default" },
  { minutes: 180, label: "3 hours", hint: "Push week" },
];

export function useOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: userApi.profile });
  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: userApi.goals });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: authApi.me });
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: contentApi.companies });

  const profile = profileQuery.data?.data;
  const email = meQuery.data?.data?.email || "";
  const companies = companiesQuery.data?.data ?? [];
  const onboarded = Boolean(profile?.onboarded);

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [targetRole, setTargetRole] = useState(TargetRole.SDE1);
  const [experience, setExperience] = useState("1-2");
  const [selected, setSelected] = useState(["Amazon", "Google", "Microsoft"]);
  const [dailyGoal, setDailyGoal] = useState(120);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated || !profileQuery.isSuccess || !goalsQuery.isSuccess) return;
    const nextProfile = profileQuery.data?.data;
    const nextGoals = goalsQuery.data?.data;
    if (nextProfile?.name) setName(nextProfile.name);
    if (nextProfile?.bio != null) setBio(nextProfile.bio);
    if (nextProfile?.targetRole) setTargetRole(nextProfile.targetRole);
    if (nextProfile?.experience) setExperience(nextProfile.experience);
    if (nextGoals?.targetRole) setTargetRole(nextGoals.targetRole);
    if (nextGoals?.targetCompanies?.length) setSelected(nextGoals.targetCompanies);
    if (nextGoals?.dailyGoalMinutes) setDailyGoal(nextGoals.dailyGoalMinutes);
    setHydrated(true);
  }, [hydrated, profileQuery.isSuccess, goalsQuery.isSuccess, profileQuery.data, goalsQuery.data]);

  function toggleCompany(companyName) {
    setSelected((cur) => (cur.includes(companyName) ? cur.filter((item) => item !== companyName) : [...cur, companyName]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await userApi.updateProfile({
        name: name.trim() || undefined,
        bio,
        targetRole,
        experience,
        onboarded: true,
      });
      await userApi.saveGoals({
        targetRole,
        targetCompanies: selected,
        dailyGoalMinutes: dailyGoal,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
      ]);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message);
    } finally {
      setSaving(false);
    }
  }

  return {
    roles: ONBOARD_ROLES,
    experiences: EXPERIENCES,
    daily: DAILY,
    profile,
    email,
    companies,
    onboarded,
    name,
    setName,
    bio,
    setBio,
    targetRole,
    setTargetRole,
    experience,
    setExperience,
    selected,
    toggleCompany,
    dailyGoal,
    setDailyGoal,
    error,
    saving,
    onSubmit,
    firstName: (name || profile?.name || "there").split(" ")[0],
    roleMeta: ONBOARD_ROLES.find((item) => item.key === targetRole),
    isLoading: !hydrated && (profileQuery.isLoading || goalsQuery.isLoading || companiesQuery.isLoading),
  };
}
