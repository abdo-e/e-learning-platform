import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.css']
})
export class ManageUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  message: string = '';
  isLoading: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to avoid memory leaks
    this.subscriptions.unsubscribe();
  }

  loadUsers(): void {
    this.isLoading = true;
    const loadSub = this.userService.getUsers()
      .pipe(
        finalize(() => this.isLoading = false),
        catchError(error => {
          console.error('Error fetching users:', error);
          this.message = 'Failed to load users. Please try again later.';
          // Return an empty array so the subscription can continue gracefully
          return of([] as User[]);
        })
      )
      .subscribe(users => {
        this.users = users;
        this.filteredUsers = users;
      });

    this.subscriptions.add(loadSub);
  }

  makeAdmin(user: User): void {
    // Do nothing if the user already has an admin role or if the _id is missing
    if (!user._id || user.role === 'admin') return;

    this.message = ''; // Clear any previous messages
    const updateSub = this.userService.updateUser(user._id, { role: 'admin' })
      .pipe(
        catchError(error => {
          console.error('Error updating user role:', error);
          this.message = 'Failed to update user role. Please try again.';
          return of(null);
        })
      )
      .subscribe(updatedUser => {
        if (updatedUser) {
          // Debug: log the updated user to inspect its structure
          console.log('Updated User:', updatedUser);
          // Use the correct property name (adjust if needed)
          this.message = `${updatedUser.name} is now an admin.`;
          // Update the local state without reloading all users
          this.users = this.users.map(u => u._id === updatedUser._id ? updatedUser : u);
          this.filteredUsers = this.filteredUsers.map(u => u._id === updatedUser._id ? updatedUser : u);
          // Clear the message after 3 seconds
          setTimeout(() => this.message = '', 3000);
        }
      });

    this.subscriptions.add(updateSub);
  }

  revokeAdmin(user: User): void {
    // Only proceed if the user has an admin role and a valid _id
    if (!user._id || user.role !== 'admin') return;

    this.message = ''; // Clear any previous messages
    // Update the role back to 'user' (or your default role)
    const updateSub = this.userService.updateUser(user._id, { role: 'user' })
      .pipe(
        catchError(error => {
          console.error('Error revoking admin role:', error);
          this.message = 'Failed to revoke admin role. Please try again.';
          return of(null);
        })
      )
      .subscribe(updatedUser => {
        if (updatedUser) {
          this.message = `${updatedUser.name} is no longer an admin.`;
          // Update the local state without reloading all users
          this.users = this.users.map(u => u._id === updatedUser._id ? updatedUser : u);
          this.filteredUsers = this.filteredUsers.map(u => u._id === updatedUser._id ? updatedUser : u);
          // Clear the message after 3 seconds
          setTimeout(() => this.message = '', 3000);
        }
      });

    this.subscriptions.add(updateSub);
  }

  deleteUser(user: User): void {
    if (!user._id) return;

    const confirmation = confirm(`Are you sure you want to delete ${user.name}?`);
    if (!confirmation) {
      return;
    }

    this.message = '';
    const deleteSub = this.userService.deleteUser(user._id)
      .pipe(
        catchError(error => {
          console.error('Error deleting user:', error);
          this.message = 'Failed to delete user. Please try again.';
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.message = response.message;
          this.users = this.users.filter(u => u._id !== user._id);
          setTimeout(() => this.message = '', 3000);
        }
      });

    this.subscriptions.add(deleteSub);
  }

  filterUsers(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }
  }

  trackByUserId(index: number, user: User): string {
    return user._id || index.toString();
  }
}
