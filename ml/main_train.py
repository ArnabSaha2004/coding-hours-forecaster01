import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
import joblib

# Example dataset
data = pd.DataFrame({
    'hobby_top1': ['Coding','Music','Sports','Coding','Music'],
    'club_top1': ['AI','Dance','Robotics','AI','Music'],
    'reads_books': ['Yes','No','Yes','No','Yes'],
    'weekly_hobby_hours': [10,5,8,12,6]
})

X = data[['hobby_top1','club_top1','reads_books']]
y = data['weekly_hobby_hours']

categorical_features = ['hobby_top1','club_top1','reads_books']
preprocessor = ColumnTransformer(transformers=[('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)])
model = Pipeline(steps=[('preprocessor', preprocessor),
                        ('regressor', RandomForestRegressor(random_state=42))])
model.fit(X,y)

joblib.dump(model, 'ml/model.pkl')
print("Model trained and saved at ml/model.pkl")
