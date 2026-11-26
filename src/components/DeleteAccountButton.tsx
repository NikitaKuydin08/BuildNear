"use client";

import { deleteAccount } from "@/app/profile/actions";

// One button, one confirmation. Same shape as "Sign out".
export function DeleteAccountButton() {
  return (
    <form
      action={deleteAccount}
      onSubmit={(e) => {
        if (!window.confirm("Delete your account and all your data? This cannot be undone.")) e.preventDefault();
      }}
    >
      <button className="min-h-12 w-full rounded-full border border-red-300 px-6 font-medium text-red-700 dark:border-red-900 dark:text-red-400" type="submit">
        Delete my account
      </button>
    </form>
  );
}
