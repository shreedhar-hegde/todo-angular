import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Todo, TodoService } from '../todo.service';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { AddItemComponent } from 'src/app/shared/add-item/add-item.component';
import { MatDialog } from '@angular/material/dialog';
import { SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-list-todo',
  templateUrl: './list-todo.component.html',
  styleUrls: ['./list-todo.component.scss'],
})
export class ListTodoComponent implements OnInit {
  todos$: Observable<Todo[]>;
  pending!: Todo[];
  inProgress!: Todo[];
  done!: Todo[];
  status: string = 'pending';
  finishBy: Date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  what!: string;
  todos!: Todo[];
  user!: SocialUser;
  loggedIn!: boolean;

  constructor(
    private todoService: TodoService,
    public dialog: MatDialog,
    private authService: SocialAuthService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.todos$ = this.todoService.fetchTodos();
  }

  drop(event: CdkDragDrop<Todo[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  filterTodos({ todos, status }: { todos: Todo[]; status: string }) {
    return todos.filter((todo: Todo) => todo.status === status);
  }

  assignTodos() {
    this.todos$.subscribe((todos: Todo[]) => {
      this.todos = todos;
      this.done = this.filterTodos({ todos, status: 'done' });
      this.inProgress = this.filterTodos({ todos, status: 'inProgress' });
      this.pending = this.filterTodos({ todos, status: 'pending' });
    });
  }

  ngOnInit(): void {
    this.assignTodos();

    this.authService.authState.subscribe((user) => {
      this.user = user;
      this.loggedIn = user != null;
    });

    this.todoService.searchInput.subscribe((input: string) => {
      if (!input) {
        this.assignTodos();
      }
      this.done = this.done.filter((ele) =>
        ele.what.toLowerCase().includes(input.toLowerCase())
      );
      this.pending = this.pending.filter((ele) =>
        ele.what.toLowerCase().includes(input.toLowerCase())
      );
      this.inProgress = this.inProgress.filter((ele) =>
        ele.what.toLowerCase().includes(input.toLowerCase())
      );
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(
      AddItemComponent,
      this.getDialogDimensions()
    );

    dialogRef.afterClosed().subscribe((result: Todo) => {
      this.todoService.addNewTodo(result);
    });
  }

  deletePending(pendingIndex: string) {
    this.pending = this.pending.filter(
      (item, index) => index === parseInt(pendingIndex)
    );
  }

  deleteTodo(todoTobeDeleted: Todo) {
    this.todos = this.todos.filter(
      (todo: Todo) => todo.what !== todoTobeDeleted.what
    );
    this.todoService.updateTodos(this.todos);
  }

  overdue(finishBy: Date) {
    const date = new Date();
    return date > new Date(finishBy);
  }

  getDialogDimensions() {
    const mobileDialogConfig = {
      maxHeight: '300px',
      maxWidth: '500px',
      
    };

    const desktopDialogConfig = {
      maxHeight: '600px',
      maxWidth: '300px',
    };

    const isMobile = this.breakpointObserver.isMatched('(max-width: 600px)');
    const data = {
      status: this.status,
      what: this.what,
      finishBy: this.finishBy,
    };
    return isMobile
      ? { mobileDialogConfig, data }
      : { desktopDialogConfig, data };
  }
}
