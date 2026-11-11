"use client";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  confirmation: string;
  buttonLabel: string;
  className?: string;
};

export function ConfirmActionForm({
  action,
  confirmation,
  buttonLabel,
  className,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
    >
      <button className={className} type="submit">
        {buttonLabel}
      </button>
    </form>
  );
}
