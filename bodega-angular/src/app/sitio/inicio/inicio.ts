import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página principal (index.html original). */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {}
