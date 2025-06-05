import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string; // Assuming role is a simple string for now
}

// Placeholder function for fetching users
// Replace this with your actual API call
async function getUsers(): Promise<User[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real application, you would fetch this from your backend:
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/`, {
  //   headers: {
  //     // Add authorization headers if needed, e.g., using the session token
  //   }
  // });
  // if (!response.ok) {
  //   throw new Error('Failed to fetch users');
  // }
  // const data = await response.json();
  // return data.results; // Assuming your API returns data in a 'results' array

  // Placeholder data
  return [
    { id: "1", name: "Alice Wonderland", email: "alice@example.com", role: "Admin" },
    { id: "2", name: "Bob The Builder", email: "bob@example.com", role: "Editor" },
    { id: "3", name: "Charlie Brown", email: "charlie@example.com", role: "Viewer" },
    { id: "4", name: "Diana Prince", email: "diana@example.com", role: "Superuser" },
  ];
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and has the Superuser role
  // Adjust the role check based on how roles are stored in your session object
  const isSuperuser = session?.user?.roles?.includes("Superuser"); 
  // Or if roles is a string: session?.user?.role === "Superuser";

  if (!isSuperuser) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let users: User[] = [];
  let fetchError: string | null = null;

  try {
    users = await getUsers();
  } catch (error) {
    console.error("Failed to fetch users:", error);
    fetchError = error instanceof Error ? error.message : "An unknown error occurred";
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage users and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <span className="font-medium">Error:</span> {fetchError}
            </div>
          )}
          {!fetchError && (
            <Table>
              <TableCaption>A list of users in the system.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email || "N/A"}</TableCell>
                    <TableCell>{user.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {users.length === 0 && !fetchError && (
            <p className="text-center text-gray-500 py-4">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
