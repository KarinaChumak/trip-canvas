import { useState, type FormEvent } from 'react';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/shadcn/field';
import { Input } from '@/components/shadcn/input';
import { useUnlockMutation } from '@/lib/access-code';

/** Asks for the shared demo code; a wrong one shows an error under the field. */
export function AccessCodeForm() {
  const [code, setCode] = useState('');
  const { mutate: unlock, data: accepted, isPending, isError } = useUnlockMutation();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim()) unlock(code.trim());
  };

  return (
    <div className="flex h-dvh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Trip canvas</CardTitle>
          <CardDescription>This demo is private. Enter the access code you were given.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* A form so Enter submits; shadcn has no form component without a form library. */}
          <form onSubmit={submit}>
            <FieldGroup>
              <Field data-invalid={accepted === false || undefined}>
                <FieldLabel htmlFor="access-code">Access code</FieldLabel>
                <Input
                  id="access-code"
                  type="password"
                  autoComplete="off"
                  autoFocus
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  aria-invalid={accepted === false || undefined}
                />
                {accepted === false && <FieldError>That code is not right.</FieldError>}
                {isError && <FieldError>Could not reach the server. Try again.</FieldError>}
              </Field>
              <Button type="submit" disabled={isPending || !code.trim()}>
                {isPending ? 'Checking…' : 'Continue'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
