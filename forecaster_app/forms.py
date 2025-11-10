from django import forms

class PredictForm(forms.Form):
    hobby_top1 = forms.IntegerField(
        label="Hobby Top 1",
        min_value=0,
        max_value=10,
        required=True
    )
    club_top1 = forms.IntegerField(
        label="Club Top 1",
        min_value=0,
        max_value=10,
        required=True
    )
    reads_books = forms.IntegerField(
        label="Reads Books",
        min_value=0,
        max_value=10,
        required=True
    )
    coding_skill = forms.IntegerField(
        label="Coding Skill",
        min_value=0,
        max_value=10,
        required=True
    )
