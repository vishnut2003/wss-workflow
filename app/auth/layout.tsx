import { AuthThemeEnforcer } from "./_components/auth-theme-enforcer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthThemeEnforcer />
      {children}
    </>
  );
}
