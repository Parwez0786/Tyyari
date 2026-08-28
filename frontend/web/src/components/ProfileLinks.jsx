export default function ProfileLinks({ githubUrl, linkedinUrl }) {
  if (!githubUrl && !linkedinUrl) return null;
  return (
    <>
      {githubUrl ? (
        <a href={githubUrl} target="_blank" rel="noreferrer" className="tab-chip">
          GitHub
        </a>
      ) : null}
      {linkedinUrl ? (
        <a href={linkedinUrl} target="_blank" rel="noreferrer" className="tab-chip">
          LinkedIn
        </a>
      ) : null}
    </>
  );
}
