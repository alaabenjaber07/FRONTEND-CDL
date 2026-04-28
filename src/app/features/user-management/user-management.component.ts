import { Component, OnInit } from '@angular/core';
import { UserService, AppUser } from '../../services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
    selector: 'app-user-management',
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
    users: AppUser[] = [];
    displayedColumns: string[] = ['id', 'username', 'nom', 'prenom', 'matricule', 'email', 'role', 'actions'];
    userForm: FormGroup;
    isEditMode = false;
    editingUserId: number | null = null;
    loading = false;

    constructor(
        private userService: UserService,
        private snackBar: MatSnackBar,
        private fb: FormBuilder,
        private location: Location
    ) {
        this.userForm = this.fb.group({
            username: ['', Validators.required],
            password: [''],
            role: ['USER', Validators.required],
            matricule: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
            nom: ['', Validators.required],
            prenom: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit() {
        this.loadUsers();
    }

    goBack() {
        this.location.back();
    }

    loadUsers() {
        this.loading = true;
        this.userService.getAllUsers().subscribe({
            next: (data) => {
                this.users = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur chargement utilisateurs', err);
                this.showError('Erreur lors du chargement des utilisateurs');
                this.loading = false;
            }
        });
    }

    showSuccess(msg: string) {
        this.snackBar.open(msg, 'Fermer', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    showError(msg: string) {
        this.snackBar.open(msg, 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    editUser(user: AppUser) {
        this.isEditMode = true;
        this.editingUserId = user.id!;
        this.userForm.patchValue({
            username: user.username,
            password: '',
            role: user.role,
            matricule: user.matricule,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email
        });
        this.userForm.get('username')?.disable();
    }

    cancelEdit() {
        this.isEditMode = false;
        this.editingUserId = null;
        this.userForm.reset({ role: 'USER' });
        this.userForm.get('username')?.enable();
    }

    deleteUser(user: AppUser) {
        if (user.role === 'SUPER_ADMIN') {
            this.showError('Impossible de supprimer un compte SUPER_ADMIN via cette interface.');
            return;
        }
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.username} ?`)) {
            this.userService.deleteUser(user.id!).subscribe({
                next: () => {
                    this.showSuccess('Utilisateur supprimé avec succès');
                    this.loadUsers();
                },
                error: (err) => {
                    this.showError(err.error?.message || 'Erreur lors de la suppression');
                }
            });
        }
    }

    onSubmit() {
        if (this.userForm.invalid) return;

        const formValue = this.userForm.getRawValue();

        if (this.isEditMode && this.editingUserId) {
            this.userService.updateUser(this.editingUserId, formValue).subscribe({
                next: () => {
                    this.showSuccess('Utilisateur mis à jour');
                    this.cancelEdit();
                    this.loadUsers();
                },
                error: (err) => {
                    this.showError(err.error || 'Erreur de mise à jour');
                }
            });
        } else {
            if (!formValue.password) {
                this.showError('Le mot de passe est obligatoire pour la création');
                return;
            }
            this.userService.createUser(formValue).subscribe({
                next: () => {
                    this.showSuccess('Utilisateur créé avec succès');
                    this.cancelEdit();
                    this.loadUsers();
                },
                error: (err) => {
                    this.showError(err.error || 'Erreur de création');
                }
            });
        }
    }
}
