import { redirect } from "next/navigation";

/** Search has been removed. Redirect to home. */
export default function SearchPage() {
  redirect("/");
}
